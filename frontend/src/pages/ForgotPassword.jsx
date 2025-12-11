import React, { useContext, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const { backendUrl } = useContext(AppContext)
    const onSubmitHandler = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post(backendUrl + '/api/user/forgot-password', { email });
            if (data.success) {
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    return (
        <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center justify-center'>
            <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-zinc-600 text-sm shadow-lg'>
                <p className='text-2xl font-semibold'>Quên mật khẩu</p>
                <p>Nhập email đã đăng ký để lấy lại mật khẩu</p>
                <div className='w-full'>
                    <p>Email</p>
                    <input
                        className='border border-zinc-300 rounded w-full p-2 mt-1'
                        type="email"
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                        required
                    />
                </div>
                <button className='bg-primary text-white w-full py-2 rounded-md text-base'>Gửi yêu cầu</button>
            </div>
        </form>
    );
}

export default ForgotPassword;