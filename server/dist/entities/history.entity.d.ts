import { User } from './user.entity';
import { Category } from './category.entity';
export declare class History {
    id: string;
    userId: string;
    categoryId: string;
    url: string;
    title: string;
    meta: string;
    useTime: number;
    visitedAt: Date;
    user: User;
    category: Category;
}
//# sourceMappingURL=history.entity.d.ts.map