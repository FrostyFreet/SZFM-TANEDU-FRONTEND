import { Route, Routes } from "react-router"
import Login from "./Login"
import Homepage from "./Homepage"
import Messages from "./Messages"
import Grades from "./Grades"
import Schedule from "./Schedule"
import Profile from "./Profile"

function App() {

  return (
    <>
    <Routes>
      <Route path="/" element={<Login/>}/>
      <Route path="/home" element={<Homepage/>}/>
      <Route path="/uzenetek" element={<Messages/>}/>
      <Route path="/jegyek" element={<Grades/>}/>
      <Route path="/orarend" element={<Schedule/>}/>
      <Route path="/adatok" element={<Profile/>}/>
    </Routes>
     
    </>
  )
}

export default App
