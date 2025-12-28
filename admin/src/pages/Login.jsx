import React, { useContext, useState } from 'react'
import { AdminContext } from '../context/AdminContext'
import axios from 'axios'
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom'
import { DoctorContext } from '../context/DoctorContext';

const Login = () => {

  const [state, setState] = useState('Quản trị viên')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { setAToken, backendUrl } = useContext(AdminContext)
  const { setDToken } = useContext(DoctorContext)

  const navigate = useNavigate()

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    try {

      if (state === "Quản trị viên") {
        // API đăng nhập dành cho Admin
        const { data } = await axios.post(backendUrl + '/api/admin/login', { email, password })
        if (data.success) {
          localStorage.setItem('aToken', data.token)
          setAToken(data.token)
          toast.success("Đăng nhập Admin thành công!")
          navigate('/')
        } else {
          toast.error(data.message)
        }
      } else {
        // API đăng nhập dành cho Bác sĩ
        const { data } = await axios.post(backendUrl + '/api/doctor/login', { email, password })
        if (data.success) {
          localStorage.setItem('dToken', data.token)
          setDToken(data.token)
          toast.success("Đăng nhập Bác sĩ thành công!")
          navigate('/doctor-dashboard')
        } else {
          toast.error(data.message)
        }
      }
    } catch (error) {
      toast.error("Lỗi đăng nhập: " + error.message)
    }

  }

  return (
    <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center' >
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5] text-sm shadow-lg '>

        <p className='text-2xl font-semibold m-auto '>
          Đăng nhập <span className='text-primary'>{state}</span>
        </p>

        <div className='w-full'>
          <p>Email</p>
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            className='border border-[#DADADA] rounded w-full p-2 mt-1 outline-none focus:border-primary'
            type="email"
            placeholder='Nhập email tài khoản'
            required
          />
        </div >

        <div className='w-full'>
          <p>Mật khẩu</p>
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            className='border border-[#DADADA] rounded w-full p-2 mt-1 outline-none focus:border-primary'
            type="password"
            placeholder='Nhập mật khẩu'
            required
          />
        </div>

        <button className='bg-primary text-white w-full py-2 rounded-md text-base hover:bg-opacity-90 transition-all'>
          Đăng nhập
        </button>

        {
          state === "Quản trị viên"
            ? <p>Đăng nhập cho Bác sĩ? <span className='text-primary underline cursor-pointer' onClick={() => setState('Bác sĩ')}>Bấm vào đây</span></p>
            : <p>Đăng nhập cho Admin? <span className='text-primary underline cursor-pointer' onClick={() => setState('Quản trị viên')}>Bấm vào đây</span></p>
        }
      </div>

    </form>
  )
}

export default Login