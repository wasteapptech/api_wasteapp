const sensorService = require('../services/SensorService');

exports.postSensorData = async (req, res) => {
    try {
        const { nameSensor, value } = req.body;

        if (!nameSensor || value === undefined) {
            return res.status(400).json({ error: 'Data sensor tidak lengkap' });
        }


        let isValidData = false;
        switch (nameSensor.toLowerCase()) {
            case 'mq4':
                isValidData = value > 600; 
                break;
            case 'dht-temp':
                isValidData = value > 30; 
                break;
            case 'dht-humidity':
                isValidData = value > 50;
                break;
            case 'ultrasonic1':
                isValidData = value >= 100;
                break;
            case 'ultrasonic2':
                isValidData = value >= 100;
                break;
            default:
                return res.status(400).json({ error: 'Tipe sensor tidak valid' });
        }

        if (!isValidData) {
            return res.status(400).json({ 
                error: 'Nilai sensor dibawah threshold' 
            });
        }

        const sensorData = {
            nameSensor,
            value,
            timestamp: new Date().toISOString()
        };

        const result = await sensorService.createSensorData(sensorData);
        res.status(201).json({
            message: 'Data sensor berhasil disimpan',
            data: result
        });

    } catch (error) {
        console.error('Error saving sensor data:', error);
        res.status(500).json({ error: 'Gagal menyimpan data sensor' });
    }
};

exports.getAllSensorData = async (req, res) => {
    try {
        const data = await sensorService.getAllSensorData();
        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching sensor data:', error);
        res.status(500).json({ error: 'Gagal mengambil data sensor' });
    }
};

exports.getLatestSensorData = async (req, res) => {
    try {
        const data = await sensorService.getLatestSensorData();
        if (!data) {
            return res.status(404).json({ error: 'Tidak ada data sensor' });
        }
        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching latest sensor data:', error);
        res.status(500).json({ error: 'Gagal mengambil data sensor terbaru' });
    }
};
