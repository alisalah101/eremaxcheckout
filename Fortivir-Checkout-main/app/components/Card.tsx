import { Check} from 'lucide-react';
import React from 'react';

type CardProps = {
  name: string,
  url: string;
  text: string;
};

const Card = ({name, url, text }: CardProps) => {
  return (
    <div className="w-[300px] rounded-lg flex flex-col items-start border[0px] shadow-lg mx-auto" >
        <img
          src={url}
          alt=""
          className="w-full h-auto rounded-xl bg-amber-200"
        /> 
         <h2 className='flex justify-center text-xl font-semibold items-center gap-1.5 px-2 py-6'>{name}<Check color="#ffffff" className='bg-black rounded-full p-0 h-[20px] ' /> </h2>
      
       <ul className="flex px-auto justify-center px-2 gap-0.5 ">
        {[...Array(5)].map((_, index) => (
          <li key={index}>
            <img
              src="/images/star.png" 
              alt="star"
              style={{ width: '15px', height: '15px' }}
            />
          </li>
        ))}
      </ul>
      <p className='m-3'>{text}</p>
     
    </div>
  );
};

export default Card;

