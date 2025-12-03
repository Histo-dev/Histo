"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
class AppService {
    getHealth() {
        return {
            status: 'ok',
            time: new Date().toISOString(),
        };
    }
}
exports.AppService = AppService;
//# sourceMappingURL=app.service.js.map