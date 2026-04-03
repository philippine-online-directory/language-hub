import prisma from '../prisma.js'
import storageService from './storageService.js'

async function addTranslationUpdateRequest({ translationId, languageId, submittedById, proposedData }) {
    const addedTranslationUpdateRequest = await prisma.translationUpdateRequest.create({
        data: {
            translationId,
            languageId,
            submittedById,
            proposedData,
            createdAt: new Date(),
        }
    });

    return addedTranslationUpdateRequest;
}

async function acceptTranslationUpdateRequest(requestId) {  
  const request = await prisma.translationUpdateRequest.findUnique({
    where: { id: requestId }
  });
  
  if (!request) throw new Error('Update request not found');

  const { translationId, submittedById, proposedData } = request;

  const translation = await prisma.translation.findUnique({
    where: { id: translationId },
    include: { author: true, secondaryAuthors: true },
  });

  if (!translation) throw new Error("Translation not found");

  const isPrimaryAuthor = translation.authorId === submittedById;

  const isAlreadySecondary = translation.secondaryAuthors.some(
    (u) => u.id === submittedById
  );

  // If new audio is proposed and translation already has one, delete old audio
  if (proposedData.audioUrl && translation.audioUrl) {
    await storageService.deleteAudioFile(translation.audioUrl);
  }

  // Apply proposedData to the translation
  const updatedTranslation = await prisma.translation.update({
    where: { id: translationId },
    data: {
      ...proposedData,
      ...( !isPrimaryAuthor && !isAlreadySecondary
        ? { secondaryAuthors: { connect: { id: submittedById } } }
        : {} ),
    },
    include: { language: true, author: true, secondaryAuthors: true },
  });

  await prisma.translationUpdateRequest.delete({
    where: { id: requestId },
  });

  return updatedTranslation;
}


async function deleteTranslationUpdateRequest(requestId) {
  const request = await prisma.translationUpdateRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) { throw new Error('Update request not found');}

  await prisma.translationUpdateRequest.delete({
    where: { id: requestId },
  });

  if (request.proposedData && request.proposedData.audioUrl) {
    try {
      await storageService.deleteAudioFile(request.proposedData.audioUrl);
    } catch (err) {
      throw new Error('Failed to delete proposed audio file: ' + err.message);
    }
  }
}


async function getTranslationUpdateRequests(languageId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [requests, total] = await Promise.all([
    prisma.translationUpdateRequest.findMany({
      where: {
        languageId
      },
      include: {
        translation: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
              },
        },
          },
        },
        submittedBy: { // include user who submitted the request
          select: {
            id: true,
            username: true,
          },
        }, 
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    }),

    prisma.translationUpdateRequest.count({
      where: { languageId },
    }),
  ]);

  const updatedRequests = await Promise.all(
    requests.map(async (req) => {
      const updatedReq = { ...req };

      if (updatedReq.translation.audioUrl) {
        updatedReq.translation.audioUrl =
          await storageService.generateDownloadUrl(updatedReq.translation.audioUrl);
      }

      if (updatedReq.proposedData?.audioUrl) {
        updatedReq.proposedData.audioUrl =
          await storageService.generateDownloadUrl(updatedReq.proposedData.audioUrl);
      }

      return updatedReq;
    })
  );

  return {
    requests: updatedRequests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

const translationUpdateRequestService = {
    addTranslationUpdateRequest,
    acceptTranslationUpdateRequest,
    deleteTranslationUpdateRequest,
    getTranslationUpdateRequests,
};

export default translationUpdateRequestService;