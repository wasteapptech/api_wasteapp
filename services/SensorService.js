const { db } = require('../config/firebase');

exports.createSensorData = async (sensorData) => {
    const sensorRef = db.ref('sensor_data');
    const newSensorRef = sensorRef.push();
    
    const timestamp = new Date().toISOString();
    const dataToSave = {
        ...sensorData,
        createdAt: timestamp
    };
    
    await newSensorRef.set(dataToSave);
    return { id: newSensorRef.key, ...dataToSave };
};

exports.getAllSensorData = async () => {
    const sensorRef = db.ref('sensor_data');
    const snapshot = await sensorRef.once('value');
    const sensorData = [];
    
    snapshot.forEach((childSnapshot) => {
        sensorData.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
        });
    });
    
    // Sort by date descending
    sensorData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return sensorData;
};

exports.getLatestSensorData = async () => {
    const sensorRef = db.ref('sensor_data');
    const snapshot = await sensorRef
        .orderByChild('createdAt')
        .limitToLast(1)
        .once('value');
    
    let latestData = null;
    snapshot.forEach((childSnapshot) => {
        latestData = {
            id: childSnapshot.key,
            ...childSnapshot.val()
        };
    });
    
    return latestData;
};
