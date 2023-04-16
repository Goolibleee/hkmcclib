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

    const logOut = () =>
    {
        setClick(false);
        props.doc.logOut();
        document.cookie = "user_id=";
        document.cookie = "password=";
        document.cookie = "autoLogin=false";
    }

    return (
            <div onClick={() => { setClick(!click)}} className={click ? 'dropdown-menu' : 'drop-menu'}>
                {props.logged &&
                    <>
                        <div className='menu-items'>
                            {props.doc.userInfo["_id"] + " : " + props.doc.userInfo["name"] + props.text.nameSuffix}
                        </div>
                        <Link className='menu-items' to="/" onClick={() => setClick(false)}>
                            {props.text.home}
                        </Link>
                        <Link className='menu-items' to="/notice" onClick={() => setClick(false)}>
                            {props.text.notice}
                        </Link>
                        <Link className='menu-items' to="/search" onClick={() => setClick(false)}>
                            {props.text.searchTitle}
                        </Link>
                        <Link className='menu-items' to="/checkOut" onClick={() => setClick(false)}>
                            {props.text.checkOutTitle}
                        </Link>
                        <div className='menu-items' onClick={() => logOut()}>
                            {props.text.logOut}
                        </div>
                    </>
                }
                {!props.logged &&
                    <>
                        <Link className='menu-items' to="/" onClick={() => setClick(false)}>
                            {props.text.home}
                        </Link>
                        <Link className='menu-items' to="/notice" onClick={() => setClick(false)}>
                            {props.text.notice}
                        </Link>
                        <Link className='menu-items' to="/checkOut" onClick={() => setClick(false)}>
                            {props.text.logIn}
                        </Link>
                        <Link className='menu-items' to="/search" onClick={() => setClick(false)}>
                            {props.text.searchTitle}
                        </Link>
                    </>
                }
            </div>
    )
}

export default DropDown;
