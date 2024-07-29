import {isMobile} from "react-device-detect";
import "./Navbar.css";
import DropDown from "./Dropdown";

function Navbar(props) {

return (
    <>
        <div id="navbar" className="navbar">
            <div className='title'>
                {isMobile? (<h1>{props.text["titleShort"]}</h1>) : (<h1>{props.text["titleLong"]}</h1>)}
            </div>
            <DropDown text={props.text} doc={props.doc}/>
        </div>
    </>
)
}
export default Navbar;
