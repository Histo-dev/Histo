import { History } from './history.entity';
import { UserCategory } from './user-category.entity';
import { UserDomainAlert } from './user-domain-alert.entity';
export declare class User {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    histories: History[];
    userCategories: UserCategory[];
    userDomainAlerts: UserDomainAlert[];
}
//# sourceMappingURL=user.entity.d.ts.map