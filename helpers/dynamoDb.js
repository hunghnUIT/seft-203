const queryAll = async (queryParams, db) => {
	let result = [];
	const queryResult = await db.query(queryParams).promise();
	if (queryResult.LastEvaluatedKey) {
		queryParams.ExclusiveStartKey = queryResult.LastEvaluatedKey;
		result = [...result, ...queryResult.Items];
		const data = await queryAll(queryParams, db);
		result = [...result, ...data];
		return result;
	}
	return queryResult.Items;
};

module.exports = {
  queryAll
};