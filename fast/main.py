from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()
# Fake database
todos = []

# Request Body Model

class Todo(BaseModel):

    title: str

    completed: bool = False

# POST Create Todo
#todo = Todo(title="Learn FastAPI", completed=False)
@app.post("/create-todos")

def create_todo(todo: Todo):
    todos.append(todo.dict())
    return {
        "message": "Todo created",
        "data": todo
    }    

@app.get("/todos")

def home():

    return {

        "message": "Todo API Running",
        "all_todos": todos,
        "total": len(todos)

    }

    # PUT Update Todo

@app.put("/todos/{todo_id}")

def update_todo(todo_id: int, updated_todo: Todo):
#dbdfsbdf
    if todo_id >= len(todos):

        return {"error": "Todo not found"}

    todos[todo_id] = updated_todo.dict()

    return {

        "message": "Todo updated",

        "data": todos[todo_id]

    }


@app.delete("/todos/{todo_id}")
def delete_todo(todo_id: int):

    # check every todo
    for todo in todos:

        # if id matches
        if todo["id"] == todo_id:

            # remove todo
            todos.remove(todo)

            return {
                "message": "Todo deleted",
                "data": todo
            }

    return {
        "error": "Todo not found"
    }    