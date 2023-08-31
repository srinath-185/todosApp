const express = require("express");
const app = express();

const isMatch = require("date-fns/isMatch");
const format = require("date-fns/format");

const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

app.use(express.json());
const initializingDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializingDBAndServer();

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search !== undefined;
};

const convertDBObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let dbResponse = null;
  let getTodosQuery = "";

  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasStatusProperty(request.query):
      if (status == "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `SELECT * FROM todo WHERE status = '${status}';`;
        dbResponse = await db.all(getTodosQuery);
        response.send(
          dbResponse.map((eachResponse) =>
            convertDBObjectToResponseObject(eachResponse)
          )
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `SELECT * FROM todo WHERE priority = '${priority}';`;
        dbResponse = await db.all(getTodosQuery);
        response.send(
          dbResponse.map((eachResponse) =>
            convertDBObjectToResponseObject(eachResponse)
          )
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasPriorityAndStatus(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status == "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE status = '${status}' AND priority = '${priority}';`;
          dbResponse = await db.all(getTodosQuery);
          response.send(
            dbResponse.map((eachResponse) =>
              convertDBObjectToResponseObject(eachResponse)
            )
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasSearchProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '${search_q}';`;
      dbResponse = await db.all(getTodosQuery);
      response.send(
        dbResponse.map((eachResponse) =>
          convertDBObjectToResponseObject(eachResponse)
        )
      );
      break;
    case hasCategoryAndStatus(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status == "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE status = '${status}' AND category = '${category}';`;
          dbResponse = await db.all(getTodosQuery);
          response.send(
            dbResponse.map((eachResponse) =>
              convertDBObjectToResponseObject(eachResponse)
            )
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `SELECT * FROM todo WHERE category = '${category}';`;
        dbResponse = await db.all(getTodosQuery);
        response.send(
          dbResponse.map((eachResponse) =>
            convertDBObjectToResponseObject(eachResponse)
          )
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategoryAndPriority(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE category = '${category}' AND priority = '${priority}';`;
          dbResponse = await db.all(getTodosQuery);
          response.send(
            dbResponse.map((eachResponse) =>
              convertDBObjectToResponseObject(eachResponse)
            )
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      data = await db.all(getTodosQuery);
      response.send(
        data.map((eachItem) => convertDBObjectToResponseObject(eachItem))
      );
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodosQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const todoItem = await db.get(getTodosQuery);
  response.send(convertDBObjectToResponseObject(todoItem));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const requestQuery = `SELECT * FROM todo WHERE due_date='${newDate}';`;
    const todos = await db.all(requestQuery);
    response.send(
      todos.map((eachItem) => convertDBObjectToResponseObject(eachItem))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status == "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const addTodosQuery = `
          INSERT INTO 
          todo (id, todo, priority, status, category, due_date)
          VALUES ('${id}', '${todo}'), '${priority}', '${status}', '${category}', '${newDueDate}';`;

          await db.run(addTodosQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const dbTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const {
    todo = dbTodoQuery.todo,
    priority = dbTodoQuery.priority,
    status = dbTodoQuery.status,
    category = dbTodoQuery.category,
    dueDate = dbTodoQuery.dueDate,
  } = request.body;
  const dbResponse = await db.all(dbTodoQuery);

  let updateTodoQuery;
  switch (true) {
    case request.body.status !== undefined:
      if (status == "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `UPDATE todo SET todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}' WHERE id = '${todoId}';`;

        await db.run(updateTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case request.body.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodoQuery = `UPDATE todo SET todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}' WHERE id = '${todoId}';`;
        await db.run(updateTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case request.body.todo !== undefined:
      updateTodoQuery = `UPDATE todo SET todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}' WHERE id = '${todoId}';`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;

    case request.body.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `UPDATE todo SET todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}' WHERE id = '${todoId}';`;
        await db.run(updateTodoQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case request.body.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `UPDATE todo SET todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}' WHERE id = '${todoId}';`;
        await db.run(updateTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id = '${todoId}';`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
