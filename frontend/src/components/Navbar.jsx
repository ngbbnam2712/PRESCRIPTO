import React, { useContext, useEffect, useState } from 'react'
import { assets } from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { DoctorContext } from '../../../admin/src/context/DoctorContext.jsx'
import { AdminContext } from '../../../admin/src/context/AdminContext.jsx'
import axios from 'axios'

const Navbar = () => {
  const navigate = useNavigate()
  const { token, setToken, userData, backendUrl } = useContext(AppContext)
  const [showMenu, setShowMenu] = useState(false)
  const { setDToken } = useContext(DoctorContext) || { setDToken: () => { } }
  const { setAToken } = useContext(AdminContext) || { setAToken: () => { } }
  const [notifications, setNotifications] = useState([]);
  const [showNoti, setShowNoti] = useState(false);

  const logOut = () => {
    setToken(false)
    if (setDToken) setDToken('')
    localStorage.removeItem('token')
    localStorage.removeItem('dToken')
    localStorage.removeItem('aToken')
    navigate('/login')
  }

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/user/notifications', { headers: { token } });
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // 30s
      return () => clearInterval(interval);
    }
  }, [token, backendUrl])

  return (
    <div className='flex items-center justify-between text-sm py-4 mb-5 border-b border-b-gray-400 '>
      <img onClick={() => navigate('/')} className='w-44 cursor-pointer' src={assets.logo} alt="" />

      {/* --- MENU MÁY TÍNH --- */}
      <ul className='hidden md:flex items-start gap-5 font-medium'>
        <NavLink to='/'>
          <li className='py-1'>TRANG CHỦ</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/doctors' >
          <li className='py-1'>DANH SÁCH BÁC SĨ</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/about'>
          <li className='py-1'>GIỚI THIỆU</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/contact'>
          <li className='py-1'>LIÊN HỆ</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
      </ul>

      <div className='flex items-center gap-4'>
        {
          token && userData
            ? <div className='flex items-center gap-4'>

              {/* --- PHẦN NOTIFICATION --- */}
              <div className='relative'>
                <img
                  onClick={() => setShowNoti(!showNoti)}
                  className='w-5 cursor-pointer hover:opacity-80 transition-opacity'
                  src={"https://cdn-icons-png.flaticon.com/512/3602/3602145.png"}
                  alt="Thông báo"
                />
                {notifications.length > 0 && (
                  <div className='absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full pointer-events-none'>
                    {notifications.length}
                  </div>
                )}

                {/* Dropdown Menu Thông báo */}
                {showNoti && (
                  <div className='absolute right-0 top-10 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden'>
                    <div className='bg-gray-50 px-4 py-2 border-b border-gray-200 font-semibold text-gray-700'>
                      Thông báo
                    </div>
                    <div className='max-h-80 overflow-y-auto'>
                      {notifications.length === 0 ? (
                        <div className='p-6 text-center text-gray-500 text-sm italic'>
                          Hiện chưa có thông báo nào.
                        </div>
                      ) : (
                        notifications.map((item, index) => (
                          <div key={index} className='px-4 py-3 border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer'>
                            <p className='text-gray-800 text-sm mb-1'>{item.message}</p>
                            <p className='text-xs text-gray-400 text-right'>
                              {new Date(item.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              {/* --- KẾT THÚC PHẦN NOTIFICATION --- */}

              {/* Phần Profile User */}
              <div className='flex items-center gap-2 cursor-pointer group relative'>
                <img className='w-8 rounded-full' src={userData.image} alt="" />
                <img className='w-2.5' src={assets.dropdown_icon} alt="" />
                <div className='absolute top-0 right-0 pt-4 text-base font-medium text-gray-600 z-20 hidden group-hover:block'>
                  <div className='min-w-48 bg-stone-100 rounded flex flex-col gap-4 p-4 shadow-lg'>
                    <p onClick={() => navigate('my-profile')} className='hover:text-black cursor-pointer'>Hồ sơ cá nhân</p>
                    <p onClick={() => navigate('my-appointments')} className='hover:text-black cursor-pointer'>Lịch hẹn của tôi</p>
                    <p onClick={logOut} className='hover:text-black cursor-pointer'>Đăng xuất</p>
                  </div>
                </div>
              </div>
            </div>
            : <button onClick={() => navigate('/login')} className='bg-primary text=white px-8 py-3 rounded-full font-light hidden md:block'>Tạo tài khoản</button>
        }

        {/* --- Mobile Menu Icon --- */}
        <img onClick={() => setShowMenu(true)} className='w-6 md:hidden' src={assets.menu_icon} alt="" />

        {/* --- Mobile Menu Content --- */}
        <div className={`${showMenu ? 'fixed w-full' : 'h-0 w-0'} md:hidden right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all`}>
          <div className='flex items-center justify-between px-5 py-6'>
            <img className='w-36' src={assets.logo} alt="" />
            <img className='w-7' onClick={() => setShowMenu(false)} src={assets.cross_icon} alt="" />
          </div>
          <ul className='flex flex-col items-center gap-2 mt-5 px-5 text-lg font-medium'>
            <NavLink onClick={() => setShowMenu(false)} to='/'><p className='px-4 py-2 rounded inline-block' >TRANG CHỦ</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/doctors'><p className='px-4 py-2 rounded inline-block' >BÁC SĨ</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/about'><p className='px-4 py-2 rounded inline-block' >GIỚI THIỆU</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/contact'><p className='px-4 py-2 rounded inline-block' >LIÊN HỆ</p></NavLink>
          </ul>
        </div>

      </div>
    </div>
  )
}

export default Navbar