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
            const menu = document.getElementById("dropdown-menu");
//            menu.hidden = !click;
            if (!click)
            {
               menu.classList.remove('is-show');
            }
            else
            {
               menu.classList.add('is-show');
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

    const changeMode = () =>
    {
        if (props.doc.admin === true)
            props.doc.setAdminMode(!props.doc.adminMode);
        else
            props.doc.setAdminMode(false);
    }

    const returnBook = () =>
    {
        console.log("Return book");
        window.history.back()
    }

    return (
            <div id='dropdown-menu' onClick={() => { setClick(!click)}} className='dropdown-menu'>
                {!props.doc.serverAvailable && props.logged &&
                    <div className='menu-items'>
                        {props.doc.userInfo["_id"] + " : " + props.doc.userInfo["name"] + props.text.nameSuffix}
                    </div>
                }
                <Link className='menu-items' to="/" onClick={() => setClick(false)}>
                    {props.text.home}
                </Link>
                <Link className='menu-items' to="/notice" onClick={() => setClick(false)}>
                    {props.text.notice}
                </Link>
                {props.doc.serverAvailable &&
                    <>
                        <Link className='menu-items' to="/search" onClick={() => setClick(false)}>
                            {props.text.bookSearch}
                        </Link>
                        <Link className='menu-items' to="/checkOut" onClick={() => setClick(false)}>
                            {props.text.checkOut}
                        </Link>
                        <Link className='menu-items' to="/return" onClick={() => setClick(false)}>
                            {props.text.return}
                        </Link>
                    </>
                }
                {!props.doc.serverAvailable && props.logged &&
                    <>
                        {!props.doc.adminMode &&
                            <Link className='menu-items' to="/checkOutStatus" onClick={() => setClick(false)}>
                                {props.text.checkOutStatus}
                            </Link>
                        }
                        {props.doc.adminMode &&
                            <>
                            <Link className='menu-items' to="/userSearch" onClick={() => setClick(false)}>
                                {props.text.userSearch}
                            </Link>
                            </>
                        }
                        {props.doc.admin &&
                            <div className='menu-items' onClick={() => changeMode()}>
                                {props.doc.adminMode && props.text.userMode}
                                {!props.doc.adminMode && props.text.adminMode}
                            </div>
                        }
                        <div className='menu-items' onClick={() => logOut()}>
                            {props.text.logOut}
                        </div>
                    </>
                }
                {!props.doc.serverAvailable && !props.logged &&
                    <>
                        <Link className='menu-items' to="/checkOutStatus" onClick={() => setClick(false)}>
                            {props.text.logIn}
                        </Link>
                        <Link className='menu-items' to="/search" onClick={() => setClick(false)}>
                            {props.text.bookSearch}
                        </Link>
                    </>
                }
            </div>
    )
}

export default DropDown;
