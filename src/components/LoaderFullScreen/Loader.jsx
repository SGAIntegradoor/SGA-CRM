
import React from 'react';
import { Image } from 'primereact/image';
import loader from "../../assets/img/integradoor.gif"

const Loader = ({ isLoading }) => {
  return (
    isLoading && (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-40" style={{ zIndex: 9999 }}>
        <div className="flex items-center justify-center">
          <Image src={loader} alt="Loading..." className='opacity-70'/>
        </div>
      </div>
    )
  );
};

export default Loader;