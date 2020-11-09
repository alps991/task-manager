require('./src/db/mongoose');
const Task = require('./src/models/task');

// Task.findByIdAndDelete("5fa34a168d9c8a186491404a").then(task => {
//     console.log(task);
//     return Task.find({ completed: false });
// }).then(tasks => {
//     console.log(tasks.length);
// }).catch(err => {
//     console.log(err);
// })


const createAndCountTasks = async () => {
    const newTask = new Task({ description: "Testing" });
    await newTask.save();
    const openTasks = await Task.find({ completed: true });
    return openTasks;
}

createAndCountTasks().then(res => {
    console.log(res);
})