export class AppService {
  getHealth() {
    return {
      status: 'ok',
      time: new Date().toISOString(),
    };
  }
}
