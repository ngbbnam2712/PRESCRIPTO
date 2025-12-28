import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const Login = () => {

  const { backendUrl, token, setToken } = useContext(AppContext)
  const navigate = useNavigate()

  const [state, setState] = useState('Đăng ký')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    try {
      if (state === 'Đăng ký') {
        const { data } = await axios.post(backendUrl + '/api/user/register', { name, email, password, phone, dob, gender })
        if (data.success) {
          localStorage.setItem('token', data.token)
          setToken(data.token)
          toast.success("Đăng ký tài khoản thành công!")
        } else {
          toast.error(data.message)
        }
      } else {
        const { data } = await axios.post(backendUrl + '/api/user/login', { email, password })
        if (data.success) {
          localStorage.setItem('token', data.token)
          setToken(data.token)
          toast.success("Đăng nhập thành công!")
        } else {
          toast.error(data.message)
        }
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (token) {
      navigate('/')
    }
  }, [token])

  return (
    <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center '>
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-zinc-600 text-sm shadow-lg'>
        <p className='text-2xl font-medium'>{state === 'Đăng ký' ? 'Tạo tài khoản' : 'Đăng nhập'}</p>
        <p>Vui lòng {state === 'Đăng ký' ? 'đăng ký' : 'đăng nhập'} để đặt lịch hẹn</p>
        {
          state === 'Đăng ký' && (
            <>
              <div className='w-full'>
                <p>Họ và tên</p>
                <input className='border border-zinc-300 rounded w-full p-2 mt-1' type="text" onChange={(e) => setName(e.target.value)} value={name} required />
              </div>

              {/* Trường số điện thoại */}
              <div className='w-full'>
                <p>Số điện thoại</p>
                <input className='border border-zinc-300 rounded w-full p-2 mt-1' type="tel" onChange={(e) => setPhone(e.target.value)} value={phone} required />
              </div>

              {/* Trường ngày sinh */}
              <div className='w-full'>
                <p>Ngày sinh</p>
                <input className='border border-zinc-300 rounded w-full p-2 mt-1' type="date" onChange={(e) => setDob(e.target.value)} value={dob} required />
              </div>

              {/* Trường giới tính */}
              <div className='w-full'>
                <p>Giới tính</p>
                <select
                  className='border border-zinc-300 rounded w-full p-2 mt-1 bg-white outline-none'
                  onChange={(e) => setGender(e.target.value)}
                  value={gender}
                  required
                >
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </>
          )
        }
        <div className='w-full'>
          <p>Email</p>
          <input className='border border-zinc-300 rounded w-full p-2 mt-1' type="email" onChange={(e) => setEmail(e.target.value)} value={email} required />
        </div>
        <div className='w-full'>
          <p>Mật khẩu</p>
          <input className='border border-zinc-300 rounded w-full p-2 mt-1' type="password" onChange={(e) => setPassword(e.target.value)} value={password} required />
        </div>

        {state === 'Đăng nhập' && (
          <p
            onClick={() => navigate('/forgot-password')}
            className='text-primary text-sm cursor-pointer hover:underline w-full text-right'
          >
            Quên mật khẩu?
          </p>
        )}

        <button type='submit' className='bg-primary text-white w-full py-2 rounded-md text-base'>
          {state === 'Đăng ký' ? 'Tạo tài khoản' : 'Đăng nhập'}
        </button>

        {state === 'Đăng ký'
          ? <p>Bạn đã có tài khoản? <span onClick={() => setState('Đăng nhập')} className='text-primary underline cursor-pointer'>Đăng nhập tại đây</span> </p>
          : <p>Bạn chưa có tài khoản? <span onClick={() => setState('Đăng ký')} className='text-primary underline cursor-pointer'>Click vào đây</span></p>}
      </div>
    </form>
  )
}

export default Login