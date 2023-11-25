import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Dropdown.css'

function DropDown(props) {

    const [dropdown, setDropdown] = useState(false);
    const [click, setClick] = useState(false)

    useEffect(
        () => {
            if (props.doc.serverAvailable)
            {
                import("./DropdownServer.css");
            }
            if (dropdown !== props.dropdown)
            {
                console.log("User clicked " + props.doc.logged);
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

        }, [props.dropdown, dropdown, click, props.doc.logged, props.doc.serverAvailable]
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
            <div id='dropdown-menu' onClick={() => { setClick(!click)}} className='dropdown-menu'>
                {!props.doc.serverAvailable && props.doc.logged &&
                    <>
                    <div className='menu-items'>
                        {props.doc.userInfo["_id"] + " : " + props.doc.userInfo["name"] + props.text.nameSuffix}
                    </div>
                    <hr className="hline"/>
                    </>
                }
                <Link className='menu-items' to="/" onClick={() => setClick(false)}>
                    {props.text.home}
                </Link>
                <Link className='menu-items' to="/notice" onClick={() => setClick(false)}>
                    {props.text.notice}
                </Link>
                <Link className='menu-items' to="/search" onClick={() => setClick(false)}>
                    {props.text.bookSearch}
                </Link>
                {props.doc.serverAvailable &&
                    <>
                        <Link className='menu-items' to="/checkOut" onClick={() => setClick(false)}>
                            {props.text.checkOut}
                        </Link>
                        <Link className='menu-items' to="/return" onClick={() => setClick(false)}>
                            {props.text.return}
                        </Link>
                    </>
                }
                {!props.doc.serverAvailable && props.doc.logged &&
                    <>
                        <Link className='menu-items' to="/checkOutStatus" onClick={() => setClick(false)}>
                            {props.text.checkOutStatus}
                        </Link>
                    </>
                }
                {props.doc.admin &&
                    <>
                    <hr className="hline"/>
                    <Link className='menu-items' to="/userSearch" onClick={() => setClick(false)}>
                        {props.text.userSearch}
                    </Link>
                    <Link className='menu-items' to="/rentalSituation" onClick={() => setClick(false)}>
                        {props.text.situation}
                    </Link>
                    <Link className='menu-items' to="/rentHistory" onClick={() => setClick(false)}>
                        {props.text.history}
                    </Link>
                    </>
                }
                {props.doc.serverAvailable && props.doc.admin &&
                    <Link className='menu-items' to="/newMember" onClick={() => setClick(false)}>
                        {props.text.newMember}
                    </Link>
                }
                {!props.doc.serverAvailable && props.doc.logged &&
                    <>
                        <hr className="hline"/>
                        <div className='menu-items' onClick={() => logOut()}>
                            {props.text.logOut}
                        </div>
                    </>
                }
                {!props.doc.serverAvailable && !props.doc.logged &&
                    <>
                        <Link className='menu-items' to="/checkOutStatus" onClick={() => setClick(false)}>
                            {props.text.logIn}
                        </Link>
                    </>
                }
            </div>
    )
}

export default DropDown;
