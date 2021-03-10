import { server } from './app'
 
const PORT: number = Number(process.env.PORT) || 5000

server.listen(PORT, () => console.log('Server listening on port ' + PORT))