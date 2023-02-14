import React, { useState } from 'react';
import {isMobile} from "react-device-detect";
import "./Navbar.css";
import DropDown from "./Dropdown";
import MenuIcon from '@mui/icons-material/Menu';

function Navbar(props) {
    const [dropdown, setDropdown] = useState(false)

    const onClick = () => {
        const maxWidth = document.getElementById("navbar").style.maxWidth;
        console.log("maxWidth");
        console.log(maxWidth);
        console.log(document.getElementById("navbar").style.width);
        setDropdown(!dropdown);
    }

return (
    <>
        <div id="navbar" className="navbar">
            <div className='title'>
                {isMobile? (<h1>{props.text["titleShort"]}</h1>) : (<h1>{props.text["titleLong"]}</h1>)}
            </div>
            <div className='menu' onClick={onClick} >
                <MenuIcon className="img" fontSize="large" sx={{ color: "#ffffff"}}/>
            </div>
            <DropDown text={props.text} dropdown={dropdown}/>
        </div>
    </>
)
}
export default Navbar;
