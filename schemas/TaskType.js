const graphql = require('graphql');
const { GraphQLObjectType, GraphQLBoolean, GraphQLString } = graphql;

const TaskType = new GraphQLObjectType({
  name: "Task",
  fields: () => ({
    userId: { type: GraphQLString },
    taskId: { type: GraphQLString },
    note: { type: GraphQLString },
    isChecked: { type: GraphQLBoolean },
  }),
});

module.exports = TaskType;