"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { cors: true });
    app.setGlobalPrefix('api');
    const port = Number(process.env.PORT) || 4000;
    await app.listen(port);
    console.log(`[server] listening on http://localhost:${port}`);
}
bootstrap().catch((error) => {
    console.error('[server] failed to start', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map