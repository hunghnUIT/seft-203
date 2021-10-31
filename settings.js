exports.USER_ID = 'user_00';

exports.DB_ENDPOINT = 'http://localhost:8000';

exports.TABLE_NAME = 'MegaTable';

exports.PK_VALUE = {
  task: 'tasks'
};

exports.SK_PATTERN_VALUE = {
  task: 'task_info::${userId}::${taskId}'
};