import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Route, Link, Form } from 'react-router-dom'
import Charge from './components/ChargeR600/ChargeR600a'
import Cooling from './components/CoolingTest/CoolingTest'
import Compressor from './components/Compressor/Compressor'
import FormScan from './components/FormScan/FormScan'
import Final from './components/Final/Final'
import Station from './components/Station/Station'
import FormScanFinal from './components/FormScan/FormScanFinal'

const router = createBrowserRouter([
  {
    path: '/',
    element: <FormScan />
  },
  {
    path: '/scan-final',
    element: <FormScanFinal />
  },
  {
    path: '/charge-r600a-report',
    element: <Charge />
  },
  {
    path: '/cooling-test-report',
    element: <Cooling />
  },
  {
    path: '/scan-compressor-report',
    element: <Compressor />
  },
  {
    path: '/final-appearance-inspection-report',
    element: <Final />
  },
  // {
  //   path: '/safety-test-report',
  //   element: <Safety />
  // },
  {
    path: '/station',
    element: <Station />
  }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
