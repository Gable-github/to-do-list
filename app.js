//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-gabryel:Testing1234@cluster0.mgjooft.mongodb.net/todolistDB");

const itemSchema = {
  name: String
}

// creating collection for todolistDB, with a pre-set schema
const Item = mongoose.model("Item", itemSchema) 

const item1 = new Item({
  name: "eat"
})

const item2 = new Item({
  name: "sleep"
})

const item3 = new Item({
  name: "work"
})

// items added in batch must be added via an array
const defaultItems = [item1, item2, item3] 

const listSchema = {
  name: String,
  items: [itemSchema] // Preparing the other schema to take in one element of the same schema
};

// creating another collection within the same todolistDB
const List = mongoose.model("List", listSchema); 

app.get("/", function(req, res) {
  Item.find({}, function(err, items){
    if (items.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved items to DB");
        }
      })
      res.redirect("/")
    } else {
      res.render("list", {listTitle: "Today", newListItems: items});
    }
  })
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  
  const item = new Item({
    name: itemName
  })

  if (listName === "Today") {
    item.save()
    res.redirect("/")
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }


});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.deleteOne({_id: checkedItemId},  function(err){
      if (err) {
        console.log(err);
      } else {
        console.log("Deleted item successfully");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err) {
        res.redirect("/"+listName);
      }
    });
  }
  
})

app.get("/:listName", function(req, res){
  let customListName = req.params.listName;
  customListName = _.capitalize(customListName);
  List.findOne({name: customListName}, function(err, foundList){
    if (foundList) {
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
    } else {
      const list = new List({
        name: customListName,
        items: defaultItems
      })
      list.save();
      res.redirect("/" + customListName);
    }
  })
})

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

// Testing1234