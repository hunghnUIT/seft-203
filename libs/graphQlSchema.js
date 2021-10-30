const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLBoolean
} = require('graphql');

const {
  getAllTasks,
  createTask,
  getTaskById,
  findOneAndDeleteTaskById,
  findOneAndUpdateTaskById
} = require('../services/taskService');

const TaskType = require('../schemas/TaskType');

const RootQueryType = new GraphQLObjectType({
  name: 'Query',
  description: 'Root Query',
  fields: () => ({
    task: {
      type: TaskType,
      description: 'A Single Task',
      args: {
        taskId: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: async (_, args) => await getTaskById(args.taskId)
    },
    tasks: {
      type: new GraphQLList(TaskType),
      description: 'List of all Tasks',
      resolve: async () => {
        
        const list = await getAllTasks();
        return list;
      },
    },
  })
})

const RootMutationType = new GraphQLObjectType({
  name: 'Mutation',
  description: 'Root Mutation',
  fields: () => ({
    createTask: {
      type: TaskType,
      description: 'Add a new task',
      args: {
        note: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: async (_, args) => {
        return await createTask(args.note);
      }
    },
    updateTask: {
      type: TaskType,
      description: 'Update a task',
      args: {
        taskId: { type: GraphQLNonNull(GraphQLString) },
        note: { type: GraphQLNonNull(GraphQLString) },
        isChecked: { type: GraphQLNonNull(GraphQLBoolean) },
      },
      resolve: async (_, args) => {
        const updatingFields = { isChecked: args.isChecked, note: args.note }
        return await findOneAndUpdateTaskById(args.taskId, updatingFields);
      }
    },
    deleteTask: {
      type: GraphQLBoolean,
      description: 'Delete a task',
      args: {
        taskId: { type: GraphQLNonNull(GraphQLString) }
      },
      resolve: async (_, args) => await findOneAndDeleteTaskById(args.taskId)
    }
  })
})

const schema = new GraphQLSchema({
  query: RootQueryType,
  mutation: RootMutationType
})

module.exports = schema;