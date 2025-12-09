import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { googleId } });
  }

  async create(userData: {
    googleId: string;
    email: string;
    name: string;
  }): Promise<User> {
    const user = this.userRepository.create(userData);
    return await this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // 존재 여부 확인
    await this.userRepository.delete(id);
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

    // 새 사용자 생성
    user = await this.create({
      googleId: `google-${Date.now()}`, // temporary googleId for backward compatibility
      email: userData.email,
      name: userData.name,
    });

    return { user, isNewUser: true };
  }
}
