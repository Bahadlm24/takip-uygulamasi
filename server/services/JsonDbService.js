const fs = require('fs');
const path = require('path');

class JsonDbService {
    constructor() {
        this.dataDir = path.join(__dirname, '../data');
    }

    _getFilePath(collection) {
        return path.join(this.dataDir, `${collection}.json`);
    }

    async read(collection) {
        const filePath = this._getFilePath(collection);
        try {
            if (!fs.existsSync(filePath)) {
                await this.write(collection, []);
                return [];
            }
            const data = await fs.promises.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error reading ${collection}:`, error);
            return [];
        }
    }

    async write(collection, data) {
        const filePath = this._getFilePath(collection);
        try {
            await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
            return true;
        } catch (error) {
            console.error(`Error writing ${collection}:`, error);
            return false;
        }
    }

    async add(collection, item) {
        const data = await this.read(collection);
        const newItem = { id: Date.now().toString(), ...item };
        data.push(newItem);
        await this.write(collection, data);
        return newItem;
    }

    async update(collection, id, updates) {
        const data = await this.read(collection);
        const index = data.findIndex(item => item.id === id);
        if (index !== -1) {
            data[index] = { ...data[index], ...updates };
            await this.write(collection, data);
            return data[index];
        }
        return null;
    }

    async delete(collection, id) {
        const data = await this.read(collection);
        const filteredData = data.filter(item => item.id !== id);
        await this.write(collection, filteredData);
        return true;
    }
}

module.exports = new JsonDbService();
