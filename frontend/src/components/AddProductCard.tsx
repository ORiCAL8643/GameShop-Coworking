import { Layout } from 'antd';
import {PlusCircleOutlined} from '@ant-design/icons';
const AddProductCard = () => {
  return (
    <Layout style={{ background: '#3f3f3f', height: 320, borderRadius: 10, marginBottom: 24}} >
        <PlusCircleOutlined style={{ fontSize: '128px' ,color: 'GrayText', justifyContent: 'center' ,height: '100vh'}}/>
    </Layout>
  );
};

export default AddProductCard;
