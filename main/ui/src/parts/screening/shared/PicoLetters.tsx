import { Tr, Td, Tooltip, Box } from '@chakra-ui/react';

export const PicoLetters = (props: { percentages: number[] }) => {
  const getLetterColor = (percent: number) => {
    if (percent >= 0 && percent < 0.05) {
      return '#ffebeb'; // red-ish
    }
    if (percent >= 0.05 && percent < 0.3) {
      return '#fff0d3'; // orange-ish
    }
    if (percent >= 0.3 && percent <= 1) {
      return '#eaffea'; // green-ish
    }
    return 'black';
  };
  return (
    <Box>
      <Tr>
        {['P', 'I', 'C', 'O'].map((letter, i) => (
          <Tooltip label={`${props.percentages[i]}%`}>
            <Td style={{ backgroundColor: getLetterColor(props.percentages[i]) }}>{letter}</Td>
          </Tooltip>
        ))}
      </Tr>
    </Box>
  );
};
