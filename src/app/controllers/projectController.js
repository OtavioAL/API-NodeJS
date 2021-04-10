const express = require('express');
const authMiddleware = require('../middlewares/auth');
const router = express.Router();

const Project = require('../models/project');
const Task = require('../models/task');


router.use(authMiddleware);
//List  
router.get('/', async (req, res) => {
  try{
    const projects = await Project.find().populate(['user', 'task']);

    return res.send({ projects });
  }catch(err){
    return res.status(400).send({ error: 'Error loading projects' });
  }
});
//Show
router.get('/:projectId', async(req, res) => {
  try{
    const project = await Project.findById(req.params.projectId).populate(['user', 'task']);

    return res.send({ project });
  }catch(err){
    return res.status(400).send({ error: 'Error loading project' });
  }
});
//Create
router.post('/', async(req, res) =>{
  try{
    const { title, description, tasks } = req.body;   

    const project = await Project.create({ title, description, user: req.userId });

    await Promise.all(tasks.map(async task => {
      const projectTask = new Task({ ...task, project: project._id });
    
      await projectTask.save();

      project.tasks.push(projectTask);

    }));

    await project.save();

    return res.send({ project });
  }catch(err){
    return res.status(400).send({ error: 'Error creating new project' });
  }
});
//Update
router.put('/:projectId', async(req, res) => {
  try{
    const { title, description, tasks } = req.body;   

    const project = await Project.findByIdAndUpdate(req.params.projectId, 
      { 
        title, 
        description,
        //Responsavel por fazer com que retorne o projeto atualizado
      }, { new: true });

    //Deletando as tasks ja existentes antes de atualizar
    project.tasks = [];
    await Task.deleteOne({ project: project._id });

    await Promise.all(tasks.map(async task => {
      const projectTask = new Task({ ...task, project: project._id });
    
      await projectTask.save();

      project.tasks.push(projectTask);

    }));

    await project.save();

    return res.send({ project });
  }catch(err){
    return res.status(400).send({ error: 'Error update project' });
  }
});
//Delete
router.delete('/:projectId', async(req, res) => {
  try{
    await Project.findByIdAndRemove(req.params.projectId);

    return res.send(); 
  }catch(err){
    return res.status(400).send({ error: 'Error deleting project' });
  }
});

module.exports = app => app.use('/projects', router);