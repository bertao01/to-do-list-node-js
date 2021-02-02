//jshint esversion=6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash")

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + "/public"));

// The url is related to atlas mongodb cloud server
// params: goes to the path to database, removes the deprication warning
mongoose.connect("mongodb+srv://admin-victor:Test1234@cluster0.ohjc7.mongodb.net/todolistDB", {
  useNewUrlParser: true,
});

const itemSchema = {
  name: String,
};

// Creates a collection called items
const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your todo list",
});

const item2 = new Item({
  name: "Hit the + button to add a new item",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved to your database");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems,
      });
    }
  });
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        
        list.save();
        res.redirect("/" + customListName)
      } else {
        //show an existing list
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items })
      }
    }
  });

});

app.post("/", (req, res) => {
  //Search for the variable newItem inside of the request
  const itemName = req.body.newItem;
    const listName = req.body.list

  const item = new Item({
    name: itemName,
  });

    if (listName === "Today"){
        item.save();
        res.redirect("/");    
    } else {
        List.findOne({name:listName}, (err,foundList)=>{
            foundList.items.push(item)
            foundList.save()
            res.redirect("/" + listName)
        })
    }

});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName
  
  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully deleted item");
          res.redirect("/");
        }
      });
  } else {
    List.findOneAndUpdate({name:listName},{$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
        if(!err){
            res.redirect("/" + listName)
        }
    })
  }
  

});

//Port heroku has setup
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, () => {
  console.log("Server has started successfully");
});
