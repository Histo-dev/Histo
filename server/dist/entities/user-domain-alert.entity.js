"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDomainAlert = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let UserDomainAlert = class UserDomainAlert {
};
exports.UserDomainAlert = UserDomainAlert;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserDomainAlert.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, name: 'user_id' }),
    __metadata("design:type", String)
], UserDomainAlert.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], UserDomainAlert.prototype, "host", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'alert_time' }),
    __metadata("design:type", Number)
], UserDomainAlert.prototype, "alertTime", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime', name: 'created_at' }),
    __metadata("design:type", Date)
], UserDomainAlert.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.userDomainAlerts),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserDomainAlert.prototype, "user", void 0);
exports.UserDomainAlert = UserDomainAlert = __decorate([
    (0, typeorm_1.Entity)('User_Domain_Alert')
], UserDomainAlert);
//# sourceMappingURL=user-domain-alert.entity.js.map