// init-mongo.js

// Connect to MongoDB
conn = new Mongo();
db = conn.getDB("oscb");

// Check if documents already exist in the collection
var countDocuments = db['form_options'].count();

// If no documents exist, insert default data into the collection
if (countDocuments === 0) {
  db['form_options'].insertMany([
    {
	"field": "Task",
	"name": "Clustering",
	"username": "default",
	"abbreviation": "CL"
},
{
	"field": "Task",
	"name": "Imputation",
	"username": "default",
	"abbreviation": "IM"
},
{
	"field": "Task",
	"name": "Batch Integration",
	"username": "default",
	"abbreviation": "BI"
},
{
	"field": "Task",
	"name": "Trajectory",
	"username": "default",
	"abbreviation": "TJ"
},
{
	"field": "Task",
	"name": "Cell-Cell Communication",
	"username": "default",
	"abbreviation": "CCC"
},
{
	"field": "Task",
	"name": "Multimodal Data Integration",
	"username": "default",
	"abbreviation": "MDI"
},
{
	"field": "Task",
	"name": "Gene Regulatory Relations",
	"username": "default",
	"abbreviation": "GRR"
},
{
	"field": "Task",
	"name": "Cell Type Annotation",
	"username": "default",
	"abbreviation": "CT"
},
{
	"field": "Task",
	"name": "Spatial",
	"username": "default",
	"abbreviation": "SP"
},
{
	"field": "Species",
	"name": "Human",
	"username": "default",
	"abbreviation": "h"
},
{
	"field": "Species",
	"name": "Mouse",
	"username": "default",
	"abbreviation": "m"
}
  ]);
  print("Default data inserted successfully.");
} else {
  print("Default data already exists in the collection. Skipping insertion.");
}

// Close the MongoDB connection
conn.close();
