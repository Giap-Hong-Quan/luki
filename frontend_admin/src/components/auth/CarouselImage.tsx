import one from "../../assets/image/1.png"
import two  from "../../assets/image/2.png"
import three from "../../assets/image/3.png"
import four from "../../assets/image/4.png"
import five  from "../../assets/image/5.png"
import six from "../../assets/image/6.png"
import seven from "../../assets/image/7.png"
import eight from "../../assets/image/8.png"
import nine from "../../assets/image/9.png"
import ten from "../../assets/image/10.png"
import { Carousel } from 'antd';


const CarouselImage = () => (
  <Carousel autoplay autoplaySpeed={3000}>
    {[one,two ,three,four,five ,six,seven,eight,nine,ten].map((image,index)=>(
        <div key={index}>
            <img className="w-full " src={image} alt="imageLogin" />    
        </div>
    ))}
  </Carousel>
);

export default CarouselImage;