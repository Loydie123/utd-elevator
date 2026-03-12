import express from 'express';
import cors from 'cors';
import Elevator from '../elevator.js';
import Person from '../person.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use(express.static('public', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

app.get('/elevator.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile('elevator.js', { root: '.' });
});

app.get('/person.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile('person.js', { root: '.' });
});

let elevator = new Elevator();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Elevator API is running' });
});

app.get('/api/elevator', (req, res) => {
  res.json({
    currentFloor: elevator.currentFloor,
    stops: elevator.stops,
    floorsTraversed: elevator.floorsTraversed,
    requests: elevator.requests,
    riders: elevator.riders
  });
});

app.get('/api/requests', (req, res) => {
  res.json({
    requests: elevator.requests,
    count: elevator.requests.length
  });
});

app.post('/api/requests', (req, res) => {
  const { name, currentFloor, dropOffFloor } = req.body;
  
  if (!name || currentFloor === undefined || dropOffFloor === undefined) {
    return res.status(400).json({ 
      error: 'Missing required fields: name, currentFloor, dropOffFloor' 
    });
  }
  
  if (currentFloor === dropOffFloor) {
    return res.status(400).json({ 
      error: 'Current floor and drop-off floor must be different' 
    });
  }
  
  const person = new Person(name, currentFloor, dropOffFloor);
  elevator.requests.push(person);
  
  res.status(201).json({
    message: 'Request added successfully',
    person,
    requests: elevator.requests
  });
});

app.get('/api/requests/:index', (req, res) => {
  const index = parseInt(req.params.index);
  
  if (index < 0 || index >= elevator.requests.length) {
    return res.status(404).json({ error: 'Request not found' });
  }
  
  res.json({
    request: elevator.requests[index],
    index
  });
});

app.put('/api/requests/:index', (req, res) => {
  const index = parseInt(req.params.index);
  
  if (index < 0 || index >= elevator.requests.length) {
    return res.status(404).json({ error: 'Request not found' });
  }
  
  const { name, currentFloor, dropOffFloor } = req.body;
  
  if (name !== undefined) elevator.requests[index].name = name;
  if (currentFloor !== undefined) elevator.requests[index].currentFloor = currentFloor;
  if (dropOffFloor !== undefined) elevator.requests[index].dropOffFloor = dropOffFloor;
  
  res.json({
    message: 'Request updated successfully',
    request: elevator.requests[index]
  });
});

app.delete('/api/requests/:index', (req, res) => {
  const index = parseInt(req.params.index);
  
  if (index < 0 || index >= elevator.requests.length) {
    return res.status(404).json({ error: 'Request not found' });
  }
  
  const deleted = elevator.requests.splice(index, 1)[0];
  
  res.json({
    message: 'Request deleted successfully',
    deleted,
    remainingRequests: elevator.requests
  });
});

app.get('/api/riders', (req, res) => {
  res.json({
    riders: elevator.riders,
    count: elevator.riders.length
  });
});

app.post('/api/dispatch', (req, res) => {
  if (elevator.requests.length === 0) {
    return res.status(400).json({ error: 'No requests to process' });
  }
  
  try {
    elevator.dispatch();
    
    res.json({
      message: 'Dispatch completed successfully',
      stats: {
        currentFloor: elevator.currentFloor,
        stops: elevator.stops,
        floorsTraversed: elevator.floorsTraversed
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Dispatch failed', 
      message: error.message 
    });
  }
});

app.post('/api/reset', (req, res) => {
  elevator.reset();
  elevator.requests = [];
  
  res.json({
    message: 'Elevator reset successfully',
    elevator: {
      currentFloor: elevator.currentFloor,
      stops: elevator.stops,
      floorsTraversed: elevator.floorsTraversed,
      requests: elevator.requests,
      riders: elevator.riders
    }
  });
});

app.get('/api/stats', (req, res) => {
  res.json({
    currentFloor: elevator.currentFloor,
    stops: elevator.stops,
    floorsTraversed: elevator.floorsTraversed,
    requestsCount: elevator.requests.length,
    ridersCount: elevator.riders.length,
    efficiency: elevator.stops > 0 
      ? (elevator.floorsTraversed / elevator.stops).toFixed(2) 
      : 0
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!', 
    message: err.message 
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Elevator API Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`🏢 Frontend available at http://localhost:${PORT}`);
});

export default app;
