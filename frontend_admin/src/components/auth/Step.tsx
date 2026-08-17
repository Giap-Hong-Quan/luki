import { Steps } from "antd";

type StepNumber ={
  current:number
}
const Step = ({current}:StepNumber) => {
  const items = [
  {
    title: (
      <span
        className={
          current >= 0
            ? "text-[rgb(141,201,96)] font-bold"
            : "text-gray-400"
        }
      >
        Nhập thông tin
      </span>
    ),
  },
  {
    title: (
      <span
        className={
          current >= 1
            ? "text-[rgb(141,201,96)] font-bold"
            : "text-gray-400"
        }
      >
        Xác thực OTP
      </span>
    ),
  },
  {
    title: (
      <span
        className={
          current >= 2
            ? "text-[rgb(141,201,96)] font-bold"
            : "text-gray-400"
        }
      >
        Đăng nhập
      </span>
    ),
  },
];
return(
  <Steps
    current={current}
    titlePlacement="vertical"
    items={items}
    ellipsis
    className="
  /* ICON PROCESS */
    [&_.ant-steps-item-process_.ant-steps-item-icon]:bg-[rgb(141,201,96)]!
    [&_.ant-steps-item-process_.ant-steps-item-icon]:border-[rgb(141,201,96)]!
    [&_.ant-steps-item-process_.ant-steps-item-icon]:shadow-none!
    [&_.ant-steps-item-process_.ant-steps-item-icon>span]:text-white!

    /* ICON FINISH */
    [&_.ant-steps-item-finish_.ant-steps-item-icon]:bg-[rgb(222,245,230)]!
    [&_.ant-steps-item-finish_.ant-steps-item-icon]:border-[rgb(141,201,96)]!
    [&_.ant-steps-item-finish_.ant-steps-item-icon]:shadow-none!
    [&_.ant-steps-item-finish_.ant-steps-item-icon>span]:text-[rgb(141,201,96)]!

    /* 🔥 LINE – XOÁ VIỀN + XOÁ GRADIENT */
    [&_.ant-steps-item-tail::after]:bg-[#E5E7EB]!
    [&_.ant-steps-item-tail::after]:border-none!
    [&_.ant-steps-item-tail::after]:shadow-none!

    "
  />
)
};

export default Step;
