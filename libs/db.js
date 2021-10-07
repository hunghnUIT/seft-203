const fs = require('fs');
const path = require("path");
const shortid = require('shortid');

const DB_ADDRESS = path.resolve(__dirname, '../db.json'); 

// const DB_ADDRESS = '/tmp/db.json';


const createNewDb = () => {
  const emptyDb = JSON.stringify({});

  fs.writeFileSync(DB_ADDRESS, emptyDb);
}

/**
 * Connect to dummy db
 * @returns All dummy data of DB in *object* type
 */
const getDbDataOrCreateDb = () => {
  try {
    let data = fs.readFileSync(DB_ADDRESS, 'utf-8');
  
    return JSON.parse(data)
  } catch (error) {
    console.log('File not exists');

    createNewDb();
  }
}

/**
 * Write all changes to DB
 * @param {Object} rawData Data in *object* type
 */
const saveDbChanges = (rawData) => {
  const proceedData = JSON.stringify(rawData);

  fs.writeFileSync(DB_ADDRESS, proceedData);
}

/**
 * @returns return all tasks in *object* type
 */
exports.getAllTasks = () => {
  const tasks = getDbDataOrCreateDb();

  return tasks;
}

/**
 * @param {String} note Note of task
 * @returns created task
 */
exports.createTask = (note) => {
  let tasks = getDbDataOrCreateDb();

  const newTaskId = shortid.generate();
  const newTask = {
    id: newTaskId,
    isChecked: false,
    note,
  }

  tasks[newTaskId] = newTask;
  saveDbChanges(tasks);

  return newTask;
}

/**
 * @param {string} id id of task
 * @returns task in *object* type if found, else *undefined* instead
 */
exports.getTaskById = (id) => {
  let data = getDbDataOrCreateDb();
  
  const findingTask = data[id];

  return findingTask;
}

/**
 * @param {string} id id of task
 * @returns task in *object* type if found, else *undefined* instead
 */
exports.findOneAndUpdateTaskById = (id, newData) => {
  let data = getDbDataOrCreateDb();
  
  if (data[id]) {
    data[id] = { ...data[id], ...newData };
    saveDbChanges(data);

    return data[id];
  }

  return null;
}

/**
 * @param {String} id Deleting task's Id
 * @returns *True* if succeed, *false* otherwise
 */
exports.findOneAndDeleteTaskById = (id) => {
  let data = getDbDataOrCreateDb();
  
  if (data[id]) {
    delete data[id];
    saveDbChanges(data);

    return true;
  }

  return false;
}