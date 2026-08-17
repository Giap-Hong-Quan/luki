
import { Flex, Input } from 'antd';
import type { GetProps } from 'antd';

type OTPProps = GetProps<typeof Input.OTP>;
type OTPFormProps ={
  onNext :()=> void
}

const OTP = ({onNext}:OTPFormProps) => {
  const onChange: OTPProps['onChange'] = (text) => {
    console.log('onChange:', text);
  };

  const onInput: OTPProps['onInput'] = (value) => {
    console.log('onInput:', value);
  };

  const sharedProps: OTPProps = {
    onChange,
    onInput,
  };

  return (
    <>
    <Flex gap="middle" align="center"  vertical>
      <Input.OTP  classNames={{input: "!p-2 !text-lg !rounded-2xl"}} formatter={(str) => str.toUpperCase()} {...sharedProps} />
    </Flex>
    <button onClick={onNext} className='w-[50%] py-4 bg-[#f5f5f5] text-[#d9d9d9] font-bold rounded-2xl hover:bg-black hover:text-white transition-colors mt-4'>Xác minh</button>
    </>
  );
};

export default OTP;