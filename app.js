const express = require("express");
const bodyParser = require("body-parser");
// 0. require mongoose package
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// 1. Create the DataBase (connect or create):
mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});

// *************Some code to avoid Unhandled Promise Rejection Warning*********************
main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://localhost:27017/todoListDB');
}
// **************************************************

// 2. Create the Schema with fields and fields' datatypees:
const itemsSchema = new mongoose.Schema({
  name: String
});

// 3. Create a model (based on the Schema, with singular form of collection's name):
const Item = new mongoose.model ("item", itemsSchema);

// 4. Create new documents with default values based on the model:
const item1 = new Item ({
  name: "Welcome to Your ToDo list!"
});

const item2 = new Item ({
  name: "Hit the + button to add a new item"
});

const item3 = new Item ({
  name: "<-- Hit this to delete an item"
});

// 5. Put default documents into the array:
const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = new mongoose.model("List", listSchema);

app.get("/", function(req, res) {

// 7. Render the default items:
  Item.find({}, function(err,foundItems){
    if (foundItems.length === 0) {
      // 6. Insert default items into the collection:
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully inserted the default items");
        };
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    };
  });
});

app.post("/", function(req, res){

  // 8. Adding new items:
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  };
});

// 9.Making a route for deleting the items from the list:
app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findOneAndDelete(checkedItemId, function(err){
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully removed the item with id" + checkedItemId);
        res.redirect("/");
      };
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err) {
        res.redirect("/" + listName);
      };
    });
  };
});

// 10. Create a dynamic route to the Work list using Express:
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function(err, foundList){
    if (!err) {
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        // Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      };
    };
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
