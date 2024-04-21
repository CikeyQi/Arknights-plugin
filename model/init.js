import fs from 'fs'
import Config from '../components/Config.js'
import {pluginRoot, _path} from './path.js'
import YAML from "yaml";

class Init {
    constructor() {
        this.initConfig()
        this.syncConfig().then(syncCount => {
            logger.info(`[Skland-Plugin] 同步了 ${syncCount} 个用户信息`)
        });
    }

    initConfig() {
        // 创建数据目录
        if (!fs.existsSync(`${_path}/data/skland`)) {
            fs.mkdirSync(`${_path}/data/skland`, {recursive: true})
        }
        // 检查默认配置文件
        const config_default_path = `${pluginRoot}/config/config_default.yaml`
        if (!fs.existsSync(config_default_path)) {
            logger.error('默认设置文件不存在，请检查或重新安装插件')
            return true
        }
        // 检查配置文件
        const config_path = `${pluginRoot}/config/config/config.yaml`
        if (!fs.existsSync(config_path)) {
            logger.error('设置文件不存在，将使用默认设置文件')
            fs.copyFileSync(config_default_path, config_path)
        }
        // 同步配置文件
        const config_default_yaml = Config.getDefConfig()
        const config_yaml = Config.getConfig()
        for (const key in config_default_yaml) {
            if (!(key in config_yaml)) {
                config_yaml[key] = config_default_yaml[key]
            }
        }
        for (const key in config_yaml) {
            if (!(key in config_default_yaml)) {
                delete config_yaml[key]
            }
        }
        Config.setConfig(config_yaml)
    }

    async syncConfig() {
        let fileList = await fs.promises.readdir(`${_path}/data/skland`);
        let successCount = 0;

        for (let fileName of fileList) {
            if (!fileName.endsWith('.yaml')) continue;

            try {
                let userInfo = YAML.parse(await fs.promises.readFile(`${_path}/data/skland/${fileName}`, 'utf-8'));
                await redis.set(`Yunzai:skland:${fileName.split('.')[0]}`, JSON.stringify(userInfo));
                successCount++;
            } catch (err) {
                logger.error(`[Skland-Plugin] 同步用户信息失败：${err}`)
            }
        }

        return successCount;
    }
}

export default new Init()
