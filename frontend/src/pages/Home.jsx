import React from 'react'
import Header from '../components/Header'
// import SpecialityMenu from '../components/SpecialityMenu'
// import TopDoctors from '../components/TopDoctors'
// import Banner from '../components/Banner'
import Specialty from '../pages/HomePage/Specialty.jsx'
import OutstandingDoctor from '../pages/HomePage/OutstandingDoctor.jsx'
import RemoteExam from './HomePage/RemoteExam.jsx'
import GeneralCheckup from './HomePage/GeneralCheckup.jsx'
const Home = () => {
  return (
    // <div>
    //   <Header/>
    //   <SpecialityMenu/>
    //   <TopDoctors/>
    //   <Banner/>
    // </div>
    <div className='bg-white'>
      <Header />
      <Specialty />
      <RemoteExam />
      <GeneralCheckup />
      <OutstandingDoctor />

    </div>
  )
}

export default Home