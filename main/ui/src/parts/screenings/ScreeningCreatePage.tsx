import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { withRouter, useHistory, useLocation } from 'react-router-dom';
import { FaUser, FaCheck } from 'react-icons/fa';
import { ImCross } from 'react-icons/im';
import {
  Container,
  FormErrorMessage,
  FormLabel,
  FormControl,
  Input,
  Textarea,
  Button,
  Select,
  Box,
  Heading,
  HStack,
  Text,
} from '@chakra-ui/react';
import { navigateFn } from '@aws-ee/core-ui';
import { useCreateScreeningForm, CreateScreeningForm } from './ScreeningCreateForm';
import { ScreeningsApi } from '../../helpers/api';

const ScreeningCreatePage: React.FunctionComponent = () => {
  const navigate = navigateFn({
    history: useHistory(),
    location: useLocation(),
  });

  const {
    handleSubmit,
    reset,
    register,
    formState: { errors, isSubmitting },
  } = useCreateScreeningForm();

  const handleCancel = () => navigate('/screenings');

  const handleFormSubmission = async (values: CreateScreeningForm) => {
    const uuid = await ScreeningsApi.create({
      ...values,
    });

    reset();

    navigate(`/screening/${uuid.id}`);
  };

  return (
    <Container maxW="container.xd" pt={5}>
      <Heading as={'h2'} mb={5} size="xl">
        New Screening Request
      </Heading>
      <form onSubmit={handleSubmit(handleFormSubmission)}>
        <FormControl isInvalid={!!errors.clinicalQuestion} isDisabled={isSubmitting}>
          <FormLabel htmlFor="clinicalQuestion">Clinical question</FormLabel>
          <Input id="clinicalQuestion" {...register('clinicalQuestion')} placeholder="How to ...?" />
          <FormErrorMessage>{errors.clinicalQuestion?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.keywords} isDisabled={isSubmitting} mt={5}>
          <FormLabel htmlFor="keywords">Keywords</FormLabel>
          <Input id="keywords" {...register('keywords')} placeholder="study, research, medicine" />
          <FormErrorMessage>{errors.keywords?.message}</FormErrorMessage>
        </FormControl>

        <Heading mt={5} size="md">
          PICO
        </Heading>

        <FormControl isInvalid={!!errors.picoP} isDisabled={isSubmitting} mt={5}>
          <FormLabel htmlFor="picoP">Person</FormLabel>
          <Textarea id="picoP" {...register('picoP')} placeholder="50-60 years old female smoker" />
          <FormErrorMessage>{errors.picoP?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.picoI} isDisabled={isSubmitting} mt={5}>
          <FormLabel htmlFor="picoI">Intervention</FormLabel>
          <Textarea id="picoI" {...register('picoI')} placeholder="lifestyle change, exercise" />
          <FormErrorMessage>{errors.picoI?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.picoC} isDisabled={isSubmitting} mt={5}>
          <FormLabel htmlFor="picoC">Comparator</FormLabel>
          <Textarea id="picoC" {...register('picoC')} placeholder="placebo" />
          <FormErrorMessage>{errors.picoC?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.picoO} isDisabled={isSubmitting} mt={5}>
          <FormLabel htmlFor="picoO">Outcome</FormLabel>
          <Textarea id="picoO" {...register('picoO')} placeholder="lung cancer risk reduction" />
          <FormErrorMessage>{errors.picoO?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.picoD} isDisabled={isSubmitting} mt={5}>
          <FormLabel htmlFor="picoD">Design (optional)</FormLabel>
          <Textarea id="picoD" {...register('picoD')} placeholder="double-blind randomized" />
          <FormErrorMessage>{errors.picoD?.message}</FormErrorMessage>
        </FormControl>

        <Box mt={5}>
          <Button leftIcon={<FaCheck />} colorScheme="blue" type="submit" isLoading={isSubmitting}>
            Create screening
          </Button>
          <Button
            leftIcon={<ImCross />}
            colorScheme="blue"
            variant="outline"
            ml={3}
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </Box>
      </form>
    </Container>
  );
};

export default withRouter(observer(ScreeningCreatePage));
