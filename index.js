const express=require("express");
const app = express();
const mongodb = require("mongodb");
const mongoclient = mongodb.MongoClient;
const ObjectId = mongodb.ObjectId;
const URL=process.env.DB;
app.use(express.json());


app.get("/",(req,res)=>{
  res.send("Welcome to Student Mentor API✔️✔️")
})


//Creating a mentor
app.post('/mentors', async (req, res) => {
    try {
        const connection = await mongoclient.connect(URL);
        const db = connection.db("Student-Mentor");
        const collection = db.collection("Mentor");
        const result = await collection.insertOne(req.body);
        await connection.close();
        res.status(200).json({ message: "Mentor created successfully" });
      } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something went wrong" });
      }
  });


//Creating a Student

 app.post("/students",async (req,res)=>{
    try {
        const connection=await mongoclient.connect(URL);
        const db=connection.db("Student-Mentor");
        const collection=db.collection("Students");
        const result = await collection.insertOne(req.body);
        await connection.close();
        res.status(200).json({message:"Student Created Successfully"})
    } catch (error) {
        res.status(500).json({message:"Something went wrong"})
    }
 }) 


 //Assign a student to Mentor

 app.post('/mentors/:mentorId/students/:studentId', async (req, res) => {
    const mentorId = req.params.mentorId;
    const studentId = req.params.studentId;
  
    try {
      const connection = await mongoclient.connect(URL);
      const db = connection.db("Student-Mentor");
      const mentorsCollection = db.collection("Mentor");
      const studentsCollection = db.collection("Students");
  
      // Find the mentor by ID and update the students array with the new student ID
      const result = await mentorsCollection.updateOne(
        { _id:new ObjectId(mentorId) },
        { $addToSet: { students:new ObjectId(studentId) } }
      );
  
      // If the mentor was not found, return a 404 error
      if (result.modifiedCount === 0) {
        res.status(404).json({ message: "Mentor not found" });
        return;
      }
  
      // Update the student document to include the mentor ID
      await studentsCollection.updateOne(
        { _id:new ObjectId(studentId) },
        { $set: { mentor:new ObjectId(mentorId) } }
      );
  
      await connection.close();
      res.status(200).json({ message: "Student assigned to mentor successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });
  


  //A student who has a mentor should not be shown in List

  app.get('/students', async (req, res) => {
    try {
      const connection = await mongoclient.connect(URL);
      const db = connection.db('Student-Mentor');
      const studentCollection = db.collection('Students');
      const mentorCollection = db.collection('Mentor');
  
      const students = await studentCollection.aggregate([
        {
          $lookup: {
            from: 'Mentor',
            localField: 'mentor',
            foreignField: '_id',
            as: 'mentor'
          }
        },
        {
          $match: {
            mentor: { $size: 0 }
          }
        }
      ]).toArray();
  
      res.status(200).json({message:"Rest of the students List"});
      connection.close();
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Something went wrong' });
    }
  });
  
  
//Change Mentor for particular Student

  app.put('/students/:id/mentor', async (req, res) => {
    try {
      const connection = await mongoclient.connect(URL);
      const db = connection.db("Student-Mentor");
      const studentCollection = db.collection("Students");
      const mentorCollection = db.collection("Mentor");
    
      const studentId = req.params.id;
      const mentorId = req.body.mentor;
    
      const student = await studentCollection.findOne({ _id: new ObjectId(studentId) });
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
    
      const mentor = await mentorCollection.findOne({ _id: new ObjectId(mentorId) });
      if (!mentor) {
        return res.status(404).json({ message: "Mentor not found" });
      }
    
      const result = await studentCollection.updateOne({ _id: new ObjectId(studentId) }, { $set: { mentor: new ObjectId(mentorId) } });
    
      await connection.close();
      res.status(200).json({ message: "Mentor assigned to student successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });



  
//API to show all students for a particular mentor
 
  app.get('/mentors/:id/students', async (req, res) => {
    try {
      const connection = await mongoclient.connect(URL);
      const db = connection.db("Student-Mentor");
      const mentorCollection = db.collection("Mentor");
      const studentCollection = db.collection("Students");
  
      const mentorId = req.params.id;
  
      const mentor = await mentorCollection.findOne({ _id: new ObjectId(mentorId) });
      if (!mentor) {
        return res.status(404).json({ message: "Mentor not found" });
      }
  
      const students = await studentCollection.find({ mentorId: new ObjectId(mentorId) }).toArray();
      await connection.close();
      res.status(200).json({ students });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });


  //API to show the previously assigned mentor for a particular student.
  app.get('/students/:id/mentor', async (req, res) => {
    try {
      const connection = await mongoclient.connect(URL);
      const db = connection.db("Student-Mentor");
      const studentCollection = db.collection("Students");
  
      const studentId = req.params.id;
      const student = await studentCollection.findOne({ _id: new ObjectId(studentId) });
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
  
      const mentorId = student.previousMentor;
      if (!mentorId) {
        return res.status(404).json({ message: "Previous mentor found for this student" });
      }
  
      const mentorCollection = db.collection("Mentor");
      const mentor = await mentorCollection.findOne({ _id: new ObjectId(mentorId) });
      if (!mentor) {
        return res.status(404).json({ message: "Mentor not found" });
      }
  
      await connection.close();
      res.status(200).json({ mentor });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });
  
  

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening on port ${port}...`));