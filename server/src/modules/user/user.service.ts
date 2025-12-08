import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { SupabaseService } from '../auth/supabase.service';

@Injectable()
export class UserService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findOne(id: string): Promise<User> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('User')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    return data as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data } = await this.supabaseService
      .getClient()
      .from('User')
      .select('*')
      .eq('email', email)
      .single();

    return data as User | null;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // 존재 여부 확인

    const { error } = await this.supabaseService
      .getClient()
      .from('User')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  async findOrCreate(userData: {
    email: string;
    name: string;
  }): Promise<{ user: User; isNewUser: boolean }> {
    // 기존 사용자 확인
    let user = await this.findByEmail(userData.email);

    if (user) {
      return { user, isNewUser: false };
    }

    // 새 사용자 생성 (OneToMany 관계는 비워둠)
    const { data, error } = await this.supabaseService
      .getClient()
      .from('User')
      .insert({
        email: userData.email,
        name: userData.name,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return { user: data as User, isNewUser: true };
  }
}