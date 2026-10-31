import { app } from './app.js';
import { config } from '../shared/config.js';

app.listen(config.portGateway, () => {
  console.log(`[API GATEWAY - PEP & PE/PA] Running on port ${config.portGateway}`);
  console.log(`  - Business Hours Enforced: ${config.accessHourStart} - ${config.accessHourEnd}`);
});
