import React, { useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';

const ResetPassword = () => {
    const { token } = useParams(); // Lấy token từ URL
    const navigate = useNavigate();
    const { backendUrl } = useContext(AppContext)
    const [newPassword, setNewPassword] = useState('');

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        try {
            // Gửi token và mật khẩu mới về server
            const { data } = await axios.post(backendUrl + '/api/user/reset-password', {
                token,
                newPassword
            });

            if (data.success) {
                toast.success(data.message);
                navigate('/login'); // Chuyển về trang đăng nhập
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
                <p className='text-2xl font-semibold'>Đặt lại mật khẩu</p>
                <div className='w-full'>
                    <p>Mật khẩu mới</p>
                    <input
                        className='border border-zinc-300 rounded w-full p-2 mt-1'
                        type="password"
                        onChange={(e) => setNewPassword(e.target.value)}
                        value={newPassword}
                        required
                    />
                </div>
                <button className='bg-primary text-white w-full py-2 rounded-md text-base'>Xác nhận</button>
            </div>
        </form>
    );
}

export default ResetPassword;