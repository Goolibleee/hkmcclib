import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Dropdown.css'

function DropDown(props) {

    const [dropdown, setDropdown] = useState(false);
    const [click, setClick] = useState(false)

    useEffect(
        () => {
            if (dropdown !== props.dropdown)
            {
                console.log("User clicked");
                console.log(props.dropdown);
                setClick(!click);
                setDropdown(props.dropdown);
            }
        }, [props.dropdown, dropdown, click]
    );

    return (
            <div onClick={() => { setClick(!click)}} className={click ? 'dropdown-menu' : 'drop-menu'}>
                <Link className='menu-items' to="/" onClick={() => setClick(false)}>
                    {props.text.home}
                </Link>
                <Link className='menu-items' to="/search" onClick={() => setClick(false)}>
                    {props.text.searchTitle}
                </Link>
                <Link className='menu-items' to="/checkOut" onClick={() => setClick(false)}>
                    {props.text.checkOutTitle}
                </Link>
            </div>
    )
}

export default DropDown;
