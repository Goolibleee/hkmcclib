import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Dropdown.css'
import MenuIcon from '@mui/icons-material/Menu';

function DropDown(props) {

    const [dropdown, setDropdown] = useState(false);

    useEffect(
        () => {
            function registerClose() {
                console.log("Register close");
                window.addEventListener("click", close);
            };

            if (props.doc.serverAvailable)
            {
                import("./DropdownServer.css");
            }

            if (dropdown)
            {
                setTimeout(registerClose, 100.);
            }

            const menu = document.getElementById("dropdown-menu");
            if (!dropdown)
            {
               menu.classList.remove('is-show');
            }
            else
            {
               menu.classList.add('is-show');
            }

            return () => {
                window.removeEventListener("click", close);
            }

            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [dropdown, props.doc.logged, props.doc.serverAvailable]
    );

    const close = () => {
        console.log("Close")
        console.log(dropdown)
        setDropdown(false);
        window.removeEventListener("click", close);
    };


    const toggleMenu = () => {
        console.log("Click menu")
        setDropdown(!dropdown);
        console.log(dropdown)
        if (dropdown)
            window.removeEventListener("click", close);
    }

    const logOut = () =>
    {
        props.doc.logOut();
        document.cookie = "user_id=";
        document.cookie = "password=";
        document.cookie = "autoLogin=false";
    }

    return (<div>
            <div className='menu' onClick={toggleMenu} >
                <MenuIcon className="img" fontSize="large" sx={{ color: "#ffffff"}}/>
            </div>
            <div id='dropdown-menu' onClick={() => { close() }} className='dropdown-menu'>
                {!props.doc.serverAvailable && props.doc.logged &&
                    <>
                    <div className='menu-items'>
                        {props.doc.userInfo["_id"] + " : " + props.doc.userInfo["name"] + props.text.nameSuffix}
                    </div>
                    <hr className="hline"/>
                    </>
                }
                <Link className='menu-items' to="/">
                    {props.text.home}
                </Link>
                <Link className='menu-items' to="/notice">
                    {props.text.notice}
                </Link>
                <Link className='menu-items' to="/search">
                    {props.text.bookSearch}
                </Link>
                {props.doc.serverAvailable &&
                    <>
                        <Link className='menu-items' to="/checkOut">
                            {props.text.checkOut}
                        </Link>
                        <Link className='menu-items' to="/return">
                            {props.text.return}
                        </Link>
                    </>
                }
                {!props.doc.serverAvailable && props.doc.logged &&
                    <>
                        <Link className='menu-items' to="/checkOutStatus">
                            {props.text.checkOutStatus}
                        </Link>
                    </>
                }
                {props.doc.admin &&
                    <>
                    <hr className="hline"/>
                    <Link className='menu-items' to="/userSearch">
                        {props.text.userSearch}
                    </Link>
                    <Link className='menu-items' to="/rentalSituation">
                        {props.text.situation}
                    </Link>
                    <Link className='menu-items' to="/rentHistory">
                        {props.text.history}
                    </Link>
                    </>
                }
                {props.doc.serverAvailable && props.doc.admin &&
                    <Link className='menu-items' to="/newMember">
                        {props.text.newMember}
                    </Link>
                }
                {!props.doc.serverAvailable && props.doc.logged &&
                    <>
                        <hr className="hline"/>
                        <div className='menu-items' onClick={logOut}>
                            {props.text.logOut}
                        </div>
                    </>
                }
                {!props.doc.serverAvailable && !props.doc.logged &&
                    <>
                        <Link className='menu-items' to="/checkOutStatus">
                            {props.text.logIn}
                        </Link>
                    </>
                }
            </div>
            </div>
    )
}


export default DropDown;
