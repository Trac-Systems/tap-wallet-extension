/* eslint-disable indent */
import {useMemo} from 'react';
import Text from '../text-custom';
import Box from '../box-custom';
import {colors} from '../../themes/color';

interface Pagination {
  currentPage: number;
  pageSize: number;
}
interface PaginationProps {
  pagination: Pagination;
  total: number;
  onChange: (pagination: Pagination) => void;
}
export const Pagination = (props: PaginationProps) => {
  const {pagination, total, onChange} = props;

  const totalPage = Math.ceil(total / pagination.pageSize);
  const preButton = useMemo(() => {
    if (pagination.currentPage == 1) {
      return (
        <Text
          title="<"
          styleType="body_16_bold"
          customStyles={{cursor: 'not-allowed'}}
        />
      );
    } else {
      return (
        <Text
          title="<"
          styleType="body_16_bold"
          customStyles={{cursor: 'pointer'}}
          onClick={() => {
            onChange({
              currentPage: pagination.currentPage - 1,
              pageSize: pagination.pageSize,
            });
          }}
        />
      );
    }
  }, [totalPage, pagination]);

  const nexButton = useMemo(() => {
    if (pagination.currentPage == totalPage) {
      return (
        <Text
          title=">"
          customStyles={{cursor: 'not-allowed'}}
          styleType="body_16_bold"
        />
      );
    } else {
      return (
        <Text
          styleType="body_16_bold"
          customStyles={{cursor: 'pointer'}}
          title=">"
          onClick={() => {
            onChange({
              currentPage: pagination.currentPage + 1,
              pageSize: pagination.pageSize,
            });
          }}
        />
      );
    }
  }, [totalPage, pagination]);

  const pageArray = useMemo(() => {
    const arr: {page: number; label: string}[] = [];
    for (let i = 0; i < totalPage; i++) {
      const page = i + 1;
      const current = pagination.currentPage;
      let start = Math.max(current - 2, 1);
      let end = Math.min(current + 2, totalPage);
      if (end - current < 2) {
        start -= 2 - (end - current);
      }
      if (current - start < 2) {
        end += 2 - (current - start);
      }
      if (page == 1 || page == totalPage) {
        arr.push({
          page,
          label: `${page}`,
        });
        continue;
      }

      if (page >= start && page <= end) {
        arr.push({
          page: page,
          label: `${page}`,
        });
      } else if (page == 2 || page == totalPage - 1) {
        arr.push({
          page: -1,
          label: '...',
        });
      }
    }
    return arr;
  }, [totalPage, pagination.currentPage]);

  return useMemo(() => {
    return (
      <Box layout="row">
        {preButton}
        {pageArray.map(v => (
          <Text
            styleType="body_14_normal"
            key={v.label}
            title={v.label}
            customStyles={{
              width: 18,
              textAlign: 'center',
              cursor: 'pointer',
              color:
                pagination.currentPage == v.page
                  ? colors.main_500
                  : colors.white,
            }}
            onClick={
              v.page == -1
                ? undefined
                : () => {
                    if (pagination.currentPage == v.page) {
                      return;
                    }
                    onChange({
                      currentPage: v.page,
                      pageSize: pagination.pageSize,
                    });
                  }
            }
          />
        ))}
        {nexButton}
      </Box>
    );
  }, [pagination, preButton, nexButton, pageArray]);
};
